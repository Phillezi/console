import {
  Autocomplete,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Link,
  Paper,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useKeycloak } from "@react-keycloak/web";
import { sentenceCase } from "change-case";
import { enqueueSnackbar } from "notistack";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addMembers,
  createTeam,
  deleteTeam,
  updateTeam,
} from "../../api/deploy/teams";
import { searchUsers } from "../../api/deploy/users";
import ConfirmButton from "../../components/ConfirmButton";
import Iconify from "../../components/Iconify";
import JobList from "../../components/JobList";
import LoadingPage from "../../components/LoadingPage";
import Page from "../../components/Page";
import useResource from "../../hooks/useResource";
import { errorHandler } from "../../utils/errorHandler";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  TeamMember,
  TeamRead,
  TeamResource,
  UserRead,
  UserReadDiscovery,
} from "@kthcloud/go-deploy-types/types/v2/body";
import { AlertList } from "../../components/AlertList";
import { NoWrapTable as Table } from "../../components/NoWrapTable";

const Teams = () => {
  const { user, teams, beginFastLoad } = useResource();
  const { t } = useTranslation();
  const theme = useTheme();
  const { initialized, keycloak } = useKeycloak();

  const [teamName, setTeamName] = useState<string>("");
  const [teamDescription, setTeamDescription] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [stale, setStale] = useState<string>("");
  const [expandedTeam, setExpandedTeam] = useState<string>("");
  const [results, setResults] = useState<UserReadDiscovery[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [users, setUsers] = useState<UserRead[]>([]);

  useEffect(() => {
    setStale("");
  }, [teams]);

  const create = async () => {
    if (!(initialized && keycloak.token)) return;
    setLoading(true);

    try {
      await createTeam(keycloak.token, teamName, teamDescription);
      beginFastLoad();
      setTeamName("");
      setTeamDescription("");
      setStale("created");
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("update-error") + e, {
          variant: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (team: TeamRead) => {
    if (!(initialized && keycloak.token)) return;

    setStale("delete " + team.id);
    try {
      await deleteTeam(keycloak.token, team.id);
      beginFastLoad();
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("update-error") + e, {
          variant: "error",
        })
      );
    }
  };

  const search = async (query: string) => {
    if (!(initialized && keycloak.token)) return;
    try {
      const response = await searchUsers(keycloak.token, query);
      let options: UserReadDiscovery[] = [];

      response.forEach((user) => {
        if (user.email) {
          user.username = user.email;
        }
        if (!users.find((u) => u.username === user.username)) {
          setUsers((users) => [...users, user]);
        }
        options.push(user);
      });

      options = [...new Set(options)];
      options.sort((a, b) => a.username.localeCompare(b.username));
      setResults(options);
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("search-error") + e, {
          variant: "error",
        })
      );
    }
  };

  const invite = async (team: TeamRead) => {
    if (!(initialized && keycloak.token)) return;

    const member = users.find(
      (user) => user.email === selected || user.username === selected
    );
    if (!member) {
      enqueueSnackbar(t("update-error"), {
        variant: "error",
      });
      return;
    }

    try {
      await addMembers(keycloak.token, team.id, [...team.members, member]);
      beginFastLoad();
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("update-error") + e, {
          variant: "error",
        })
      );
    }
  };

  const handleRemoveResource = async (
    team: TeamRead,
    resource: TeamResource
  ) => {
    if (!(initialized && keycloak.token)) return;

    const currentIds = team.resources
      .map((r) => r.id)
      .filter((id) => id !== resource.id);

    const body = {
      resources: currentIds,
    };

    try {
      await updateTeam(keycloak.token, team.id, body);
      beginFastLoad();
      setStale("removeResource " + resource.id + team.id);
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("update-error") + e, {
          variant: "error",
        })
      );
    }
  };

  const handleRemoveUser = async (team: TeamRead, user: TeamMember) => {
    if (!(initialized && keycloak.token)) return;

    const body = {
      members: team.members.filter((member) => member.id !== user.id),
    };

    try {
      await updateTeam(keycloak.token, team.id, body);
      beginFastLoad();
      setStale("removeUser " + user.id + team.id);
    } catch (error: any) {
      errorHandler(error).forEach((e) =>
        enqueueSnackbar(t("update-error") + e, {
          variant: "error",
        })
      );
    }
  };

  return (
    <>
      {!user ? (
        <LoadingPage />
      ) : (
        <Page title={t("teams")}>
          <Container>
            <Stack spacing={3}>
              <Typography variant="h4" gutterBottom>
                {t("teams")}
              </Typography>

              <AlertList />
              <JobList />

              <Card sx={{ boxShadow: 20 }}>
                <CardHeader
                  title={t("current-teams")}
                  subheader={
                    <>
                      {t("teams-subheader-1")}
                      <br />
                      {t("teams-subheader-2")}
                    </>
                  }
                />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="teams table">
                      <TableBody>
                        {teams.map((team, index) =>
                          stale !== "delete " + team.id ? (
                            <Fragment key={team.id + "teams-table"}>
                              <TableRow
                                key={"teamrow" + team.id}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                  cursor: "pointer",
                                  background:
                                    expandedTeam === team.id
                                      ? theme.palette.grey[200]
                                      : "transparent",
                                }}
                                onClick={() =>
                                  expandedTeam === team.id
                                    ? setExpandedTeam("")
                                    : setExpandedTeam(team.id)
                                }
                              >
                                <TableCell component="th" scope="row">
                                  <Stack direction="column" spacing={1}>
                                    <Typography variant="body1">
                                      {team.name}
                                    </Typography>
                                    <Typography variant="caption">
                                      {team.description}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems={"center"}
                                    useFlexGap
                                  >
                                    <AvatarGroup max={4}>
                                      {team.members.map((member) =>
                                        member.gravatarUrl ? (
                                          <Avatar
                                            src={member.gravatarUrl + "?s=32"}
                                            sx={{ width: 24, height: 24 }}
                                            key={"avatar" + member.id}
                                          />
                                        ) : (
                                          <Avatar
                                            sx={{ width: 24, height: 24 }}
                                            key={"avatar" + member.id}
                                          >
                                            <Iconify
                                              icon="mdi:account"
                                              sx={{ width: 16, height: 16 }}
                                              title="Profile"
                                            />
                                          </Avatar>
                                        )
                                      )}
                                      {team.members.length === 0 && (
                                        <Tooltip title={"Boo!"}>
                                          <Avatar
                                            sx={{ width: 24, height: 24 }}
                                          >
                                            <Iconify icon="mdi:ghost" />
                                          </Avatar>
                                        </Tooltip>
                                      )}
                                    </AvatarGroup>
                                    {`${team.members.length} ${t("members")}`}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems={"center"}
                                    useFlexGap
                                  >
                                    <Iconify icon="mdi:account-group" />
                                    {team.resources &&
                                      team.resources.length +
                                        " " +
                                        (team.resources.length > 1 ||
                                        team.resources.length === 0
                                          ? t("resources")
                                          : t("resource"))}
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  <Iconify
                                    icon={
                                      expandedTeam === team.id
                                        ? "mdi:expand-less"
                                        : "mdi:expand-more"
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                              {expandedTeam === team.id && (
                                <TableRow
                                  key={"teamrow" + team.id + "expanded"}
                                >
                                  <TableCell colSpan={3}>
                                    <Stack direction="column" spacing={1}>
                                      <TableContainer>
                                        <Table>
                                          <TableHead>
                                            <TableRow>
                                              <TableCell colSpan={5}>
                                                {t("members")}
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {team.members.map((member) => (
                                              <TableRow
                                                key={
                                                  team.id +
                                                  " " +
                                                  member.username
                                                }
                                              >
                                                {stale ===
                                                "removeUser " +
                                                  member.id +
                                                  team.id ? (
                                                  <TableCell colSpan={5}>
                                                    <Skeleton
                                                      animation="wave"
                                                      height={64}
                                                    />
                                                  </TableCell>
                                                ) : (
                                                  <>
                                                    <TableCell>
                                                      {member.email ||
                                                        member.username}
                                                    </TableCell>
                                                    <TableCell>
                                                      {sentenceCase(
                                                        member.id ===
                                                          team.ownerId
                                                          ? t("owner")
                                                          : t("member")
                                                      )}
                                                    </TableCell>
                                                    <TableCell>
                                                      {sentenceCase(
                                                        member.memberStatus
                                                      )}
                                                    </TableCell>
                                                    <TableCell
                                                      sx={{
                                                        color: "text.secondary",
                                                      }}
                                                    >
                                                      {
                                                        member?.addedAt
                                                          ?.replace("T", " ")
                                                          ?.split(".")[0]
                                                      }
                                                    </TableCell>
                                                    <TableCell align="right">
                                                      {member.id !==
                                                        team.ownerId && (
                                                        <ConfirmButton
                                                          action={t("remove")}
                                                          actionText={
                                                            t(
                                                              "remove"
                                                            ).toLowerCase() +
                                                            " " +
                                                            (member.email ||
                                                              member.username) +
                                                            " " +
                                                            t("from-team")
                                                          }
                                                          callback={() =>
                                                            handleRemoveUser(
                                                              team,
                                                              member
                                                            )
                                                          }
                                                          props={{
                                                            color: "error",
                                                            startIcon: (
                                                              <Iconify icon="mdi:account-multiple-remove" />
                                                            ),
                                                          }}
                                                        />
                                                      )}
                                                    </TableCell>
                                                  </>
                                                )}
                                              </TableRow>
                                            ))}

                                            <TableRow>
                                              <TableCell colSpan={5}>
                                                <Stack
                                                  direction="row"
                                                  spacing={3}
                                                  alignItems={"center"}
                                                  justifyContent={
                                                    "space-between"
                                                  }
                                                  useFlexGap
                                                  pt={1}
                                                  pb={2}
                                                >
                                                  <Autocomplete
                                                    disableClearable
                                                    options={results}
                                                    inputValue={selected}
                                                    sx={{ minWidth: 300 }}
                                                    onInputChange={(
                                                      _,
                                                      value
                                                    ) => {
                                                      setSelected(value);
                                                      search(value);
                                                    }}
                                                    getOptionLabel={(
                                                      option
                                                    ) => {
                                                      return option.username;
                                                    }}
                                                    isOptionEqualToValue={(
                                                      option,
                                                      value
                                                    ) => {
                                                      return (
                                                        option.id === value.id
                                                      );
                                                    }}
                                                    renderOption={(
                                                      props,
                                                      option
                                                    ) => {
                                                      return (
                                                        <li
                                                          {...props}
                                                          key={option.id}
                                                        >
                                                          <Grid
                                                            container
                                                            alignItems="center"
                                                          >
                                                            <Grid
                                                              item
                                                              sx={{
                                                                display: "flex",
                                                                width: 44,
                                                              }}
                                                            >
                                                              {option.gravatarUrl ? (
                                                                <Avatar
                                                                  src={
                                                                    option.gravatarUrl +
                                                                    "?s=32"
                                                                  }
                                                                  sx={{
                                                                    width: 20,
                                                                    height: 20,
                                                                  }}
                                                                />
                                                              ) : (
                                                                <Avatar
                                                                  sx={{
                                                                    width: 20,
                                                                    height: 20,
                                                                  }}
                                                                >
                                                                  <Iconify
                                                                    icon="mdi:account"
                                                                    sx={{
                                                                      width: 16,
                                                                      height: 16,
                                                                    }}
                                                                    title="Profile"
                                                                  />
                                                                </Avatar>
                                                              )}
                                                              <Grid
                                                                item
                                                                sx={{
                                                                  width:
                                                                    "calc(100% - 44px)",
                                                                  wordWrap:
                                                                    "break-word",
                                                                  paddingLeft: 1,
                                                                }}
                                                              ></Grid>
                                                              <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                              >
                                                                {
                                                                  option.username
                                                                }
                                                              </Typography>
                                                            </Grid>
                                                          </Grid>
                                                        </li>
                                                      );
                                                    }}
                                                    renderInput={(params) => (
                                                      <TextField
                                                        {...params}
                                                        label={t(
                                                          "search-for-users"
                                                        )}
                                                        InputProps={{
                                                          ...params.InputProps,
                                                          type: "search",
                                                        }}
                                                        variant="outlined"
                                                      />
                                                    )}
                                                  />
                                                  <Button
                                                    onClick={() => invite(team)}
                                                    variant="contained"
                                                    startIcon={
                                                      <Iconify icon="mdi:invite" />
                                                    }
                                                  >
                                                    {t("invite")}
                                                  </Button>
                                                  <Box
                                                    component="div"
                                                    sx={{ flexGrow: 1 }}
                                                  />
                                                  {user.id === team.ownerId && (
                                                    <ConfirmButton
                                                      action={t("delete")}
                                                      actionText={
                                                        t("delete") +
                                                        " " +
                                                        team.name
                                                      }
                                                      callback={() =>
                                                        handleDelete(team)
                                                      }
                                                      props={{
                                                        color: "error",
                                                        startIcon: (
                                                          <Iconify icon="mdi:delete" />
                                                        ),
                                                      }}
                                                    />
                                                  )}
                                                </Stack>
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                      {team.resources &&
                                        team.resources.length > 0 && (
                                          <TableContainer>
                                            <Table>
                                              <TableHead>
                                                <TableRow>
                                                  <TableCell colSpan={3}>
                                                    {t("resources")}
                                                  </TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {team.resources.map((r) => (
                                                  <TableRow
                                                    key={r.id + team.id}
                                                  >
                                                    {stale ===
                                                    "removeResource " +
                                                      r.id +
                                                      team.id ? (
                                                      <TableCell colSpan={3}>
                                                        <Skeleton
                                                          animation="wave"
                                                          height={64}
                                                        />
                                                      </TableCell>
                                                    ) : (
                                                      <>
                                                        <TableCell>
                                                          <Link
                                                            component={
                                                              RouterLink
                                                            }
                                                            to={`/edit/${r.type}/${r.id}`}
                                                            sx={{
                                                              textDecoration:
                                                                "none",
                                                            }}
                                                          >
                                                            {r.name}
                                                          </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                          {r.type}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                          <ConfirmButton
                                                            action={t("remove")}
                                                            actionText={
                                                              t(
                                                                "remove"
                                                              ).toLowerCase() +
                                                              " " +
                                                              r.name +
                                                              " " +
                                                              t(
                                                                "from-team"
                                                              ).toLowerCase()
                                                            }
                                                            callback={() =>
                                                              handleRemoveResource(
                                                                team,
                                                                r
                                                              )
                                                            }
                                                            props={{
                                                              color: "error",
                                                              startIcon: (
                                                                <Iconify icon="mdi:account-multiple-remove" />
                                                              ),
                                                            }}
                                                          />
                                                        </TableCell>
                                                      </>
                                                    )}
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </TableContainer>
                                        )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          ) : (
                            <TableRow key={"loading-row-" + index}>
                              <TableCell colSpan={3}>
                                <Skeleton animation="wave" height={64} />
                              </TableCell>
                            </TableRow>
                          )
                        )}

                        {stale === "created" && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Skeleton animation="wave" height={64} />
                            </TableCell>
                          </TableRow>
                        )}

                        {teams.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography variant="body1">
                                {t("no-teams")}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card sx={{ boxShadow: 20 }}>
                <CardHeader title={t("create-team")} />
                <CardContent>
                  <Stack
                    spacing={2}
                    direction={"column"}
                    alignItems={"flex-start"}
                  >
                    <TextField
                      label={t("admin-name")}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      fullWidth
                      disabled={loading}
                      variant="outlined"
                    />
                    <TextField
                      label={t("description")}
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      fullWidth
                      disabled={loading}
                      variant="outlined"
                    />
                    <Button
                      variant="contained"
                      onClick={create}
                      disabled={loading}
                    >
                      {t("create-and-go")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Container>
        </Page>
      )}
    </>
  );
};

export default Teams;
