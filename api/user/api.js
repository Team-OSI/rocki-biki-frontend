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

export const getUserEmail = async () => {
  try {
    const response = await api.get('/api/users/getUserInfo');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};


export const setNickname = async (nickname, image) => {
  const formData = new FormData();
  formData.append('nickname', nickname);
  formData.append('image', image);

  const jwtToken = Cookies.get('JWT_TOKEN'); 

  const response = await axios.post(`${process.env.NEXT_PUBLIC_SPRING_SERVER}/api/users/profile/set`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${jwtToken}` 
    }
  });
  return response.data;
};

export const getNickname = async (userEmail) => {
  try {
    const response = await api.get('/api/users/profile/get', {
      params: { userEmail }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateProfile = async (nickname, profileImage) => {
  const jwtToken = Cookies.get('JWT_TOKEN');
  const formData = new FormData();
  formData.append('nickname', nickname);
  if (profileImage instanceof File) {
    formData.append('image', profileImage);
  }

  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SPRING_SERVER}/api/users/profile/update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${jwtToken}`
      },
    });
    return response.data;
  } catch (error) {
    console.error('프로필 업데이트 중 오류 발생:', error);
    throw error;
  }
};

export const getAudioUrls = async (info) => {
  try {
    const response = await api.get(`/api/users/profile/opponent/sound`, { params: { email: info.email } });
    console.log('Fetched audio URLs:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching audio URLs:', error);
    throw error;
  }
};

export const fetchAudioUrls = async (setAudioUrls) => {
  try {
    const response = await api.get('/api/users/profile/sound');
    console.log('Fetched audio URLs:', response.data);
    setAudioUrls(response.data);
  } catch (error) {
    console.error('Error fetching audio URLs:', error);
    throw error;
  }
};

export const updateAudio = async (formData) => {

  const jwtToken = Cookies.get('JWT_TOKEN');
  const response = await axios.post(`${process.env.NEXT_PUBLIC_SPRING_SERVER}/api/users/profile/sound`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  return response.data;
};

export const updateNickname = async (nickname, image) => {
  const formData = new FormData();
  formData.append('nickname', nickname);
  formData.append('image', image);

  const jwtToken = Cookies.get('JWT_TOKEN'); 
  console.log(formData);
  const response = await axios.post(`${process.env.NEXT_PUBLIC_SPRING_SERVER}/api/users/profile/update`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${jwtToken}` 
    }
  });
  return response.data;
};

export const getGameResults = async (userEmail, page = 0, size = 10, sort = 'DESC', sortField = 'createdAt') => {
  try {
    const response = await api.post('/api/game/recent-result', {
      userEmail,
      page,
      size,
      sort,
      sortField
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching game results:', error);
    throw error;
  }
};
