import API from "./api";

export const fetchUsers = async ({ queryKey }) => {
  const [, page, limit, search] = queryKey;
  const { data } = await API.get(
    `/users?page=${page}&limit=${limit}&search=${search}`
  );
  return data;
};

export const fetchUser = async ({ queryKey }) => {
  const [, id] = queryKey;
  const { data } = await API.get(`/users/${id}`);
  return data;
};

export const fetchCurrentUser = async () => {
  try {
    const response = await API.get("/users/me");
    return response?.data;
  } catch (error) {
    return null;
  }
};

export const updateUser = async ({ userId, userData }) => {
  const response = await API.put(`/users/${userId}`, userData);
  return response.data;
};
