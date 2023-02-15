import { useState } from 'react';
import './style/Expandable.css';

export default function Expandable({ title, children }) {
    const [expanded, set_expanded] = useState(true);

    function on_click() {
        set_expanded(!expanded);
    }

    return (
        <div className='expandable'>
            <div className={expanded ? 'expandable-header-expanded' : 'expandable-header'} onClick={on_click}>
                {title}
            </div>
            {!expanded ||
                <div className='expandable-content'>
                    {children}
                </div>
            }

        </div>
    );
}
