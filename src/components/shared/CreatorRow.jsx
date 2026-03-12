// src/components/shared/CreatorRow.jsx
import { useNavigate } from 'react-router-dom'

const CreatorRow = ({ creator }) => {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/@${creator.username}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '20px', cursor: 'pointer',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: creator.avatar_color || '#D97757',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: 900, color: 'white', flexShrink: 0,
      }}>
        {creator.initial}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#21201C', lineHeight: 1.2 }}>
          {creator.name}
          {creator.is_verified && (
            <span style={{ marginLeft: '4px', fontSize: '13px' }}>✓</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#AAA49C', fontWeight: 600 }}>
          @{creator.username}
        </div>
      </div>
      <div style={{
        marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#AAA49C',
      }}>
        View profile →
      </div>
    </div>
  )
}

export default CreatorRow
