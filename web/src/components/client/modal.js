import { MaterialSymbol } from '@c/icon';

import styles from './modal.module.css';



export default function Modal({heading, setIsOpen, children}) {
    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.head}>
                    <div>
                        <h3>{heading}</h3>
                    </div>
                    <div>
                        <button onClick={() => setIsOpen(false)}>
                            <MaterialSymbol name='close'/>
                        </button>
                    </div>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
}