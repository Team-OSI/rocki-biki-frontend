import React, { useState } from 'react';
import { login } from '@/api/user/api'; // 로그인 API 호출을 위한 함수 임포트
import SignupModal from '@/components/login/SignUpModal';

export default function logindiv({ onclose, onlogin }) {
  const [showsignupmodal, setshowsignupmodal] = usestate(false);
  const [email, setemail] = usestate("");
  const [password, setpassword] = usestate("");

  const handlelogin = async (e) => {
    e.preventdefault(); // prevent form submission
    try {
      const response = await login(email, password); // 로그인 api 호출
      // console.log(response);
      alert("welcom to rocki-biki!!")
      onlogin();
      onclose();
    } catch (err) {
      alert(err);
    }
  };

  const handleOAuthLogin = (provider) => {
    const springServerUrl = process.env.NEXT_PUBLIC_SPRING_SERVER;
    const nextAppUrl = process.env.NEXT_PUBLIC_NEXT;

    if (!springServerUrl || !nextAppUrl) {
      console.error('환경변수가 설정되지 않았습니다.');
      return;
    }

    window.location.href = `${springServerUrl}/oauth2/authorization/${provider}?redirect_uri=${nextAppUrl}&mode=login`;
  };

  const handlesignupsuccess = () => {
    setshowsignupmodal(false);
  }

  return (
    <div classname="relative flex flex-col items-center justify-center bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
      <button onclick={onclose} classname="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
      <h2 classname="text-xl font-bold mb-6 text-dark">login</h2>
      <form onsubmit={handlelogin}>
        <input
          type="text"
          placeholder="email"
          value={email}
          onchange={(e) => setemail(e.target.value)}
          classname="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onchange={(e) => setpassword(e.target.value)}
          classname="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <button
          type="submit"
          classname="w-full bg-secondary text-white py-2 rounded-md hover:bg-primarylight transition duration-300"
        >
          login
        </button>
      </form>
      <p classname="my-4 text-dark">or</p>
      <div classname="flex justify-center gap-2 w-full">
        <button
          onclick={() => handleoauthlogin('kakao')}
          classname="flex-1 bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-700 transition duration-300"
        >
          kakao
        </button>
        <button
          onclick={() => handleoauthlogin('google')}
          classname="flex-1 bg-white text-black py-2 rounded-md hover:bg-gray-400 transition duration-300 border border-black"
        >
          google
        </button>
        <button
          onclick={() => handleoauthlogin('naver')}
          classname="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-800 transition duration-300"
        >
          naver
        </button>
      </div>
      <div classname="mt-4">
        계정이 없다면?
        <button onclick={() => setshowsignupmodal(true)} classname="hover:underline text-blue-600 ml-1">
          sign up
        </button>
      </div>
      { showSignupModal && < SignupModal onClose={() => setShowSignupModal(false)} onSuccess={handleSignUpSuccess} />}
    </div>
  );
}