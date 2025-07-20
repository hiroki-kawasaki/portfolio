'use client';

import { useState } from 'react';
import Link from 'next/link';

import { setSessionAction, logoutAction } from '@a/session';
import { MaterialSymbol } from '@c/icon';
import Modal from '@c-c/modal';
import cn from '@f/classnames';


import styles from './button.module.css';



export function SetSessionButton ({ name, value, className, children }) {
    const setSession = async (e) => {
        await setSessionAction(name, value);
        e.preventDefault();
    };

    return (
        <button className={className} onClick={setSession}>
            {children}
        </button>
    );
}

export function SetSessionIconButton ({ name, value, className, iconName }) {
    return (
        <SetSessionButton
            name={name}
            value={value}
            className={cn('flex aic', className)}
        >
            <MaterialSymbol name={iconName}/>
        </SetSessionButton>
    );
}



export function OpenModalButton ({className, buttonContent, heading, children}) {
    const [isOpen, setIsOpen] = useState(false);

    return (<>
        <button className={className} onClick={() => setIsOpen(true)}>
            {buttonContent}
        </button>
        {isOpen && (
            <Modal heading={heading} setIsOpen={setIsOpen}>
                {children}
            </Modal>
        )}
    </>);
}

export function OpenModalIconButton ({className, iconName, heading, children}) {
    return (
        <OpenModalButton>
            {children}
        </OpenModalButton>
    );
}



export function GoogleLoginButton ({text}) {
    return (
        <Link href="/login/google" className={styles['gsi-material-button']}>
            <div className={styles['gsi-material-button-state']}></div>
            <div className={styles['gsi-material-button-content-wrapper']}>
                <div className={styles['gsi-material-button-icon']}>
                    <svg className="d-b" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                </div>
                <span className={styles['gsi-material-button-contents']}>{text} with Google</span>
                <span className={styles['gsi-material-button-contents-none']}>{text} with Google</span>
            </div>
        </Link>
    );
}


export function LogoutButton({ className, children }) {
    const handler = async (e) => {
        await logoutAction();
        e.preventDefault();
    };

    return (
        <button className={className} onClick={handler}>
            {children}
        </button>
    );
}
