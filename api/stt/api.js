import axios from 'axios';

// 기본 URL 설정
const api = axios.create({
  baseURL: 'http://localhost:5000',
});

export const startRecognition = async () => {
  try {
    const response = await api.post('/api/start_recognition');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getRecognition = async () => {
  try {
    const response = await api.post('/api/get_text');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
