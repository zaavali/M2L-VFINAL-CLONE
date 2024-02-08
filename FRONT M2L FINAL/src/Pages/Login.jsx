
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CSS/Login.css';
import Admin from './admin';
import { Link } from 'react-router-dom';

export default function Connection() {
  const [formdata, setFormData] = useState({ email: '', mdp: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    if (storedLoginStatus && storedLoginStatus === 'true') {
      setIsConnected(true);
      const isAdminStored = localStorage.getItem('isAdmin');
      setIsAdmin(isAdminStored === 'true');
    }
  }, [setIsConnected]);

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/api/user/conn/', formdata);
      const token = response.data.token;
      setIsConnected(true);
      setIsAdmin(response.data.isAdmin);
      
      // Stocker le token dans un cookie avec la date d'expiration spécifiée
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 2); // Ajoutez 2 heures à l'heure actuelle
      document.cookie = `token=${token}; Expires=${expirationDate.toUTCString()}; Secure; SameSite=Strict`;
    
      // Redirection ou traitement supplémentaire après la connexion réussie
    } catch (error) {
      console.error(error);
      setLoginMessage('Échec de la connexion. Veuillez vérifier vos informations.');
    }
  };
  

  const handleLogout = async () => {
    try {
        // Appeler le point de terminaison de déconnexion
        await axios.post('http://localhost:4000/api/user/logout');
        // Réinitialiser l'état local de connexion et d'administration
        setIsConnected(false);
        setIsAdmin(false);
        // Supprimer le cookie stocké localement
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Supprimer le token du localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
    } catch (error) {
        console.error(error);
    }
};

  return (
    <>
      {isConnected ? (
        <div>
          <h1>Vous êtes connecté</h1>
          {isAdmin ? (
            <Admin></Admin>
          ) : (
            <p>Connecté en tant qu'utilisateur</p>
          )}
          <button onClick={handleLogout}>Se déconnecter</button>
        </div>
      ) : (
        <div className='loginsignup'>
          <div className='loginsignup-container'>
            <h1>Bonjour</h1>
            <form className="loginsignup-fields" onSubmit={handleLog}>
            <input
  onChange={(e) => setFormData({ ...formdata, email: e.target.value })}
  type='email'
  name='email'
  placeholder='Adresse e-mail'
/>

<input
  onChange={(e) => setFormData({ ...formdata, mdp: e.target.value })}
  type='password'
  name='mdp'
  placeholder='Mot de passe'
/>
              <button type='submit' className="no-underline">Se connecter</button>
            </form>
            <p className="login-message">{loginMessage}</p>
            <p className="loginsignup-login">
              Vous êtes nouveau ici ? <Link to="/signup" className="no-underline">S'inscrire</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
