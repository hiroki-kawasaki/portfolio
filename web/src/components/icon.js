import Link from 'next/link';

import cn from '@f/classnames';



export function MaterialSymbol ({ name, className }) {
    const [iconName, s] = name.split(':');
    return (
        <span className={cn('material-symbols-outlined', s === 'fill' && 'fill', className)}>{iconName}</span>
    );
}



export function MaterialSymbolLink ({ href, name, className, children }) {
    return (
        <Link href={href} className="flex aic">
            <MaterialSymbol name={name} className={cn(className, children && 'pe-2')}/>
            {children}
        </Link>
    );
}