'use client';

import { useState, useRef, useEffect } from 'react';

import { MaterialSymbol } from '@c/icon';
import { SetSessionButton, LogoutButton as BaseLogoutButton } from '@c-c/button';
import cn from '@f/classnames';
import useTranslate from '@f/i18n';

import styles from './dropdown.module.css';



export default function Dropdown({ className, buttonContent, buttonIconName, buttonClassName, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
        <div className={cn(className, styles['settings'])} ref={dropdownRef}>
            <button className={cn(buttonClassName, styles['toggle'])} onClick={toggleDropdown}>
                {buttonContent || <MaterialSymbol name={buttonIconName}/>}
            </button>
            {isOpen && (
                <div className={styles['menu']}>
                    {children}
                </div>
            )}
        </div>
    );
}


export function DropdownSection ({ title, children }) {
    return (
        <div className={styles['menu-section']}>
            { title && <div className={styles['section-title']}>{title}</div> }
            <div className={styles['options-group']}>{children}</div>
        </div>
    );
}


export function DropdownDivider () {
    return <div className={styles['divider']}></div>;
}


export function DropdownSetSessionButton ({ name, value, isActive, children }) {
    return (
        <SetSessionButton
            name={name}
            value={value}
            className={cn(styles['item'], isActive && styles.active)}
        >{children}</SetSessionButton>
    );
}

export function LogoutButton ({lang}) {
    const t = useTranslate(lang);

    return (
        <BaseLogoutButton className={cn(styles['item'])}>
            <MaterialSymbol name="logout" />
            <span>{t('logout')}</span>
        </BaseLogoutButton>
    );
}