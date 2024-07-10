// 'use client'

// import SignupModal from '@/components/login/SignUpModal'
// import React, { useState } from 'react'

// export default function LoginModal({ onClose, onLogin }) {
//   const [showModal, setShowModal] = useState(false);

//   const handleLogin = () => {
//     onLogin();
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="relative bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
//         <h2 className="text-xl font-bold mb-6 text-dark">LOGIN</h2>
//         <input
//           type="text"
//           placeholder="ID"
//           className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
//         />
//         <button
//           onClick={handleLogin}
//           className="w-full bg-secondary text-white py-2 rounded-md hover:bg-primaryLight transition duration-300"
//         >
//           Login
//         </button>
//         <p className="my-4 text-dark">or</p>
//         <button className="w-full bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-700 transition duration-300">
//           Kakao Login
//         </button>
//         <div className="mt-4">
//           계정이 없다면?
//           <button onClick={() => setShowModal(true)} className='hover:underline text-blue-600'>
//             Sign Up
//           </button>
//         </div>
//         {showModal && <SignupModal onClose={() => setShowModal(false)} />}
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>
//       </div>
//     </div>
//   );
// }