import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { Deployment } from "../../../types";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { useKeycloak } from "@react-keycloak/web";
import { updateDeployment } from "../../../api/deploy/deployments";
import { enqueueSnackbar } from "notistack";
import { errorHandler } from "../../../utils/errorHandler";
import Iconify from "../../../components/Iconify";
import useResource from "../../../hooks/useResource";

export default function InitCommandManager({
  deployment,
}: {
  deployment: Deployment;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [commands, setCommands] = useState<string[]>([]);
  const { t } = useTranslation();
  const { initialized, keycloak } = useKeycloak();
  const { queueJob } = useResource();

  const handleSave = async (commands: string[]) => {
    if (!(initialized && keycloak.token)) return;
    const newCommands = commands.map((cmd) => cmd.trim());
    if (newCommands === deployment.initCommands) return;

    setLoading(true);

    try {
      const res = await updateDeployment(
        deployment.id,
        { initCommands: newCommands },
        keycloak.token
      );
      queueJob(res);
      enqueueSnackbar(t("saving-initcmd-update"), {
        variant: "info",
      });
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("could-not-save-initcmd") + e, {
          variant: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log(JSON.stringify(commands));
  }, [commands]);
  return (
    <Card sx={{ boxShadow: 20 }}>
      <CardHeader
        title={t("create-deployment-initcmd")}
        subheader={t("create-deployment-initcmd-subheader")}
      />
      <CardContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <Stack
            direction="row"
            spacing={3}
            alignItems={"center"}
            flexWrap={"wrap"}
            useFlexGap
          >
            <TextField
              label={t("create-deployment-initcmd")}
              variant="outlined"
              placeholder={deployment.initCommands?.join(" ")}
              value={commands.join(" ")}
              onChange={(e) => setCommands(e.target.value.split(" "))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(commands);
                }
              }}
              fullWidth
              sx={{ maxWidth: "sm" }}
              disabled={loading}
            />
            <LoadingButton
              variant="contained"
              onClick={() => handleSave(commands)}
              startIcon={<Iconify icon="material-symbols:save" />}
              loading={loading}
            >
              {t("button-save")}
            </LoadingButton>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
