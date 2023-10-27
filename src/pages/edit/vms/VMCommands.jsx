import { Button, Stack } from "@mui/material";
import { useKeycloak } from "@react-keycloak/web";
import { sentenceCase } from "change-case";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { deleteVM, applyCommand } from "src/api/deploy/vms";
import ConfirmButton from "src/components/ConfirmButton";
import Iconify from "src/components/Iconify";
import useResource from "src/hooks/useResource";
import { errorHandler } from "src/utils/errorHandler";

export const VMCommands = ({ vm }) => {
  const { initialized, keycloak } = useKeycloak();
  const { queueJob } = useResource();
  const navigate = useNavigate();

  const doDelete = async () => {
    if (!(initialized && keycloak.authenticated)) return;

    try {
      const res = await deleteVM(vm.id, keycloak.token);

      if (res) {
        queueJob(res);
        enqueueSnackbar("VM deleting... ", { variant: "info" });
        navigate("/deploy");
      }
    } catch (error) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar("Could not delete vm: " + e, {
          variant: "error",
        })
      );
    }
  };

  const executeCommand = async (command) => {
    if (!(initialized && keycloak.authenticated)) return;

    try {
      await applyCommand(vm.id, command, keycloak.token);
      enqueueSnackbar(sentenceCase(command) + " VM in progress... ", {
        variant: "info",
      });
    } catch (error) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar("Could not execute command: " + e, {
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
      {vm.status !== "resourceStopped" && (
        <Button
          onClick={() => executeCommand("stop")}
          variant="contained"
          to="#"
          startIcon={<Iconify icon="mdi:shutdown" />}
          color="warning"
        >
          Stop
        </Button>
      )}
      {vm.status === "resourceRunning" && (
        <Button
          onClick={() => executeCommand("reboot")}
          variant="contained"
          to="#"
          startIcon={<Iconify icon="mdi:restart" />}
          color="warning"
        >
          Reboot
        </Button>
      )}
      {!(
        vm.status === "resourceRunning" || vm.status === "resourceStarting"
      ) && (
        <Button
          onClick={() => executeCommand("start")}
          variant="contained"
          to="#"
          startIcon={<Iconify icon="mdi:shutdown" />}
          color="warning"
        >
          Start
        </Button>
      )}

      <ConfirmButton
        action="Delete"
        actionText={"delete " + vm.name}
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
