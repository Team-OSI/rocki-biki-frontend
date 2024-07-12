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

export const setNickname = async (nickname, image) => {
  const formData = new FormData();
  formData.append('nickname', nickname);
  formData.append('image', image);

  const jwtToken = Cookies.get('JWT_TOKEN'); // 쿠키에서 JWT 토큰 가져오기

  const response = await axios.post(`${process.env.NEXT_PUBLIC_SPRING_SERVER}/api/users/profile/set`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${jwtToken}` // 헤더에 JWT 토큰 추가
    }
  });
  return response.data;
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