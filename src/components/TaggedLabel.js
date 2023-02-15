import './style/TaggedLabel.css';

export default function TaggedLabel({ tag, children }) {
    return (
        <div className='tagged-label'>
            <span className='tag'>
                {tag}
            </span>
            <span className='tagged-content'>
                {children}
            </span>
        </div>
    );
}
