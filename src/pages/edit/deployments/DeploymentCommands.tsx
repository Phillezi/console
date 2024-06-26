import { Button, Stack, Link } from "@mui/material";
import { useKeycloak } from "@react-keycloak/web";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  deleteDeployment,
  applyCommand,
} from "../../../api/deploy/deployments";
import Iconify from "../../../components/Iconify";
import useResource from "../../../hooks/useResource";
import { sentenceCase } from "change-case";
import ConfirmButton from "../../../components/ConfirmButton";
import { errorHandler } from "../../../utils/errorHandler";
import { useTranslation } from "react-i18next";
import { Deployment } from "../../../types";

export const DeploymentCommands = ({
  deployment,
}: {
  deployment: Deployment;
}) => {
  const { t } = useTranslation();
  const { queueJob } = useResource();
  const { initialized, keycloak } = useKeycloak();
  const navigate = useNavigate();

  const doDelete = async () => {
    if (!(initialized && keycloak.token)) return;

    try {
      const res = await deleteDeployment(deployment.id, keycloak.token);

      if (res) {
        queueJob(res);
        enqueueSnackbar(t("resource-deleting"), { variant: "info" });
        navigate("/deploy");
      }
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("error-deleting-resource") + e, {
          variant: "error",
        })
      );
    }
  };

  const executeCommand = async (command: string) => {
    if (!(initialized && keycloak.authenticated && keycloak.token)) return;

    try {
      await applyCommand(deployment.id, command, keycloak.token);
      enqueueSnackbar(
        sentenceCase(command) + " " + t("deployment-in-progress"),
        {
          variant: "info",
        }
      );
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("failed-update") + ": " + e, {
          variant: "error",
        })
      );
    }
  };

  return (
    <Stack
      direction="row"
      flexWrap={"wrap"}
      alignItems={"center"}
      spacing={3}
      useFlexGap={true}
    >
      <Button
        onClick={() => executeCommand("restart")}
        variant="contained"
        startIcon={<Iconify icon="mdi:restart" />}
        color="warning"
      >
        {t("button-restart")}
      </Button>
      {deployment.type === "deployment" &&
        Object.hasOwn(deployment, "url") &&
        deployment.url !== "" &&
        deployment.private === false && (
          <Button
            component={Link}
            href={
              deployment.customDomain
                ? deployment.customDomain.url
                : deployment.url
            }
            target="_blank"
            rel="noreferrer"
            underline="none"
            startIcon={<Iconify icon="mdi:external-link" />}
            variant="contained"
          >
            {t("visit-page")}
          </Button>
        )}

      <ConfirmButton
        action={t("button-delete")}
        actionText={`${t("button-delete")} `.toLowerCase() + deployment.name}
        callback={doDelete}
        props={{
          color: "error",
          variant: "contained",
          startIcon: <Iconify icon="mdi:nuke" />,
        }}
      />
    </Stack>
  );
};
