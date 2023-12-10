export const joinTeam = async (token, teamId, code) => {
  const url = `${process.env.REACT_APP_DEPLOY_API_URL}/teams/${teamId}`;
  const body = { invitationCode: code };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  return result;
};

export const getTeams = async (token) => {
  const url = `${process.env.REACT_APP_DEPLOY_API_URL}/teams`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let result = await response.json();
  result.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });


  for (let i = 0; i < result.length; i++) {
    result[i].members &&
    result[i].members.sort((a, b) => {
      return new Date(a.addedAt) - new Date(b.addedAt);
    });
  }
  return result;
};

export const createTeam = async (token, name, description) => {
  const url = `${process.env.REACT_APP_DEPLOY_API_URL}/teams`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
};

export const deleteTeam = async (token, teamId) => {
  const url = `${process.env.REACT_APP_DEPLOY_API_URL}/teams/${teamId}`;

  await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const addMembers = async (token, teamId, members) => {
  const url = `${process.env.REACT_APP_DEPLOY_API_URL}/teams/${teamId}`;
  const body = { members: members };

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
};