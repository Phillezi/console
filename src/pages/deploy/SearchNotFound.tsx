import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface SearchNotFoundProps {
  searchQuery?: string;
  [x: string]: any;
}

export default function SearchNotFound({
  searchQuery = "",
  ...other
}: SearchNotFoundProps) {
  const { t } = useTranslation();

  return (
    <Paper {...other}>
      {searchQuery !== "" ? (
        <>
          <Typography gutterBottom align="center" variant="subtitle1">
            {t("no-deployments-found")}
          </Typography>
          <Typography variant="body2" align="center">
            {t("no-results-for")}
            &nbsp;
            <strong>{searchQuery}</strong>. {t("no-results-for-subheader")}
          </Typography>
        </>
      ) : (
        <Typography gutterBottom align="center" variant="subtitle1">
          {t("no-deployments-found")}
        </Typography>
      )}
    </Paper>
  );
}
