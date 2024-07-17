'use client';
import React, { createContext, useState, useContext } from 'react';

const TitleContext = createContext();

export const TitleProvider = ({ children }) => {
    const [title, setTitle] = useState('Lobby');

    return (
        <TitleContext.Provider value={{ title, setTitle }}>
            {children}
        </TitleContext.Provider>
    );
};

export const useTitle = () => useContext(TitleContext);