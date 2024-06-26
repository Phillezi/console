import {
  Alert as AlertBar,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import useAlert from "../hooks/useAlert";
import { Alert } from "../api/alert/types";
import Iconify from "./Iconify";

export const AlertList = () => {
  const { alerts } = useAlert();

  const renderAlert = (alert: Alert, index: number) => {
    const domain = window.location.hostname;

    if (alert.active === false) {
      return null;
    }

    if (!alert.domains?.includes(domain)) {
      if (domain !== "localhost") return null;
    }

    if (alert.pages && !alert.pages?.includes(window.location.pathname)) {
      return null;
    } else {
      if ("/deploy" !== window.location.pathname) return null;
    }

    if (alert.showFrom && new Date(alert.showFrom) > new Date()) {
      return null;
    }

    if (alert.showUntil && new Date(alert.showUntil) < new Date()) {
      return null;
    }

    return (
      <AlertBar
        severity={alert.severity || "info"}
        sx={{ width: "100%", my: 5 }}
        key={"alert-" + index}
        variant={alert.variant}
        action={
          alert.link ? (
            <IconButton
              color="inherit"
              size="small"
              href={alert.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Iconify icon="mdi:external-link" />
            </IconButton>
          ) : null
        }
      >
        <Typography variant="body1">{alert.title}</Typography>
        {alert.content && (
          <Typography variant="body2">{alert.content}</Typography>
        )}
      </AlertBar>
    );
  };

  return (
    <Stack direction="column" spacing={2} sx={{ my: 2 }}>
      {alerts.map((alert, index) => renderAlert(alert, index))}
    </Stack>
  );
};
