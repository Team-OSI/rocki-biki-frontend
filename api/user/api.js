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
    const token = Cookies.get('JWT_TOKEN');
    if(token) {
      config.headers.Authorization = `Bearer ${token}`;
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

export const setNickname = async (nickname, file) => {
  try {
    const formData = new FormData();
    formData.append('nickname', nickname);
    formData.append('image', file);

    const response = await axios.post('/api/users/profile/set', formData, {
      baseURL: process.env.NEXT_PUBLIC_SPRING_SERVER,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true,
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw new Error('Network or server error');
    }
  }
};

export const getNickname = async () => {
  try {
    const response = await api.get('/api/users/profile/get', {
    });
    console.log(response.data.nickname);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateNickname = async () => {
  try {
    const response = await api.post('/api/users/profile/update', {
      nickname: nickname,
      // email: email,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};