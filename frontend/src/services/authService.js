import axios from 'axios';

// Khởi tạo instance của axios trỏ về backend
const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hàm gọi API Đăng ký
export const registerUser = async (userData) => {
  try {
    const response = await API.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Đăng ký thất bại!' };
  }
};

// Hàm gọi API Đăng nhập
export const loginUser = async (credentials) => {
  try {
    const response = await API.post('/auth/login', credentials);
    // Nếu đăng nhập thành công, lưu token vào localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Đăng nhập thất bại!' };
  }
};

// Hàm lấy thông tin user hiện tại (Dùng token)
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await API.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data;
  }
};

// Hàm đăng xuất
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};