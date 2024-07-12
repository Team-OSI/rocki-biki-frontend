import axios from 'axios';
import Cookies from 'js-cookie';

// 기본 URL 설정
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SPRING_SERVER,
  headers: {
    'Content-Type' : 'application/json'
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if(token) {
      config.headers.Authorization = `Bearer $(token)`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const signUp = async (email, passWord) => {
    try {
      const response = await api.post('/api/auth/register', {
        email: email,
        password: passWord,
      });
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
};

export const login = async (email, passWord) => {
  try {
    const response = await api.post('/api/auth/login', {
      email: email,
      password: passWord,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// export const registNickname = async (email) => {
//   try {
//     const response = await api.post('/api/auth/registNickname', {
//       email: email,
//     });
//     return response.data;
//   } catch (error) {
//     throw error.response.data;
//   }
// };