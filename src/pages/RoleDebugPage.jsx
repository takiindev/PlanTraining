import { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';
import { getCurrentUserEmail, getUserByEmail } from '../services/tokenService';
import { createOwner } from '../services/setupService';

function RoleDebugPage() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const email = getCurrentUserEmail();
        if (email) {
          const accountData = await getUserByEmail(email);
          console.log("Current account data:", accountData);
          setCurrentUser(accountData);
        }

        // Load all users
        const users = await getAllUsers();
        console.log("All users:", users);
        setAllUsers(users);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateOwner = async (userEmail) => {
    try {
      const result = await createOwner(userEmail);
      setMessage(result.message);
      
      if (result.success) {
        // Refresh data
        const users = await getAllUsers();
        setAllUsers(users);
      }
    } catch (error) {
      setMessage('Lỗi: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Role Debug Information</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc'
        }}>
          {message}
        </div>
      )}
      
      <h3>Current User:</h3>
      <pre>{JSON.stringify(currentUser, null, 2)}</pre>
      
      <h3>All Users:</h3>
      {allUsers.map((user, index) => (
        <div key={index} style={{ 
          border: '1px solid #ccc', 
          margin: '10px 0', 
          padding: '10px',
          backgroundColor: user.role === 'owner' ? '#ffffcc' : 'white'
        }}>
          <strong>Email:</strong> {user.email}<br/>
          <strong>Role:</strong> {user.role || 'undefined'}<br/>
          <strong>Name:</strong> {user.firstName} {user.lastName}<br/>
          <strong>ID:</strong> {user.id || user.uid}<br/>
          
          {user.role !== 'owner' && (
            <button 
              onClick={() => handleCreateOwner(user.email)}
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                backgroundColor: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Make Owner
            </button>
          )}
          
          <details style={{ marginTop: '10px' }}>
            <summary>View Raw Data</summary>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </details>
        </div>
      ))}
    </div>
  );
}

export default RoleDebugPage;
