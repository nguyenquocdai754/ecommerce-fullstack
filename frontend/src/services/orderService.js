import api from "./api";

export const createOrder = async (payload) => (await api.post("/orders", payload)).data.data;
export const getMyOrders = async () => (await api.get("/orders/my-orders")).data.data;
export const getOrder = async (id) => (await api.get(`/orders/${id}`)).data.data;
export const getManagedOrder = async (id) => (await api.get(`/management/orders/${id}`)).data.data;
export const cancelOrder = async (id, reason) => api.patch(`/orders/${id}/cancel`, { reason });
export const confirmOrderReceived = async (id) => api.patch(`/orders/${id}/received`);
