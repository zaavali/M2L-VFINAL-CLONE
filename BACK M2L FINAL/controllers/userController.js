const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { setCookie } = require('../../FRONT M2L FINAL/src/Pages/Cookie');
const { pool } = require('../database/database');

exports.getAllUser = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT uuid, nom, email FROM user');
        res.status(200).json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

exports.postUser = async (req, res) => {
    try {
        let conn;

        conn = await pool.getConnection();
        const result = await conn.query('SELECT * FROM user WHERE email = ?', [req.body.email]);
        conn.release();
        
        if (result.length > 0) {
            return res.status(400).json({ error: 'Cet utilisateur existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(req.body.mdp, 10);

        conn = await pool.getConnection();
        const uuid = crypto.randomUUID();
        const insertUserQuery = 'INSERT INTO user (uuid, nom, email, mdp) VALUES (?, ?, ?, ?)';
        const insertUserValues = [uuid, req.body.nom, req.body.email, hashedPassword];
        await conn.query(insertUserQuery, insertUserValues);
        conn.release();

        const token = jwt.sign({ email: req.body.email }, process.env.API_KEY, { expiresIn: '1h' });

        // Définir le cookie dans la réponse
        setCookie('token', token, { maxAge: 3600000, httpOnly: true, secure: true, sameSite: 'strict' }, res);

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
};

exports.conn = async (req, res) => {
    const { email, mdp } = req.body;
  
    try {
      const conn = await pool.getConnection();
      const rows = await conn.query('SELECT email, mdp, admin FROM user WHERE email = ?', [email]);
      conn.release();
  
      if (rows && rows.length > 0) {
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
  
        if (isPasswordValid) {
          // Calculer la date d'expiration pour 2 heures
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + 2); // Ajoutez 2 heures à l'heure actuelle
  
          const token = jwt.sign({ email: user.email, isAdmin: user.admin === 1 }, process.env.API_KEY, { expiresIn: '2h' });
  
          // Définir le cookie dans la réponse avec la nouvelle date d'expiration
          setCookie('token', token, { expires: expirationDate, httpOnly: true, secure: true, sameSite: 'strict' }, res);
  
          res.status(200).json({ token, isAdmin: user.admin === 1 });
        } else {
          res.status(401).json({ message: 'Identifiants invalides' });
        }
      } else {
        res.status(401).json({ message: 'Identifiants invalides' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur de serveur' });
    }
  };

exports.updateUser = async (req, res) => {
    const { uuid, nom, email, mdp, admin } = req.body;
    const adminValue = isNaN(parseInt(admin)) ? 0 : parseInt(admin);
    let conn;
    try {
        conn = await pool.getConnection();

        const hashedPassword = await bcrypt.hash(mdp, 10);

        const rows = await conn.query("UPDATE user SET nom=?, email=?, mdp=?, admin=? WHERE uuid=?", [nom, email, hashedPassword, adminValue, uuid]);

        res.status(200).json(rows.affectedRows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteUser = async (req, res) => {
    const uuid = req.params.uuid;
    
    try {
        // Connexion à la base de données
        const conn = await pool.getConnection();
        
        // Exécution de la requête DELETE pour supprimer l'utilisateur en fonction de l'UUID
        const result = await conn.query('DELETE FROM user WHERE uuid = ?', [uuid]);
        
        // Libération de la connexion à la base de données
        conn.release();

        // Vérification du nombre de lignes affectées pour confirmer la suppression de l'utilisateur
        if (result.affectedRows === 1) {
            // Si une seule ligne a été affectée, l'utilisateur a été supprimé avec succès
            res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
        } else {
            // Sinon, l'utilisateur avec l'UUID spécifié n'a pas été trouvé
            res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        // Gestion des erreurs
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
};


exports.isAdmin = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Access Denied, Token not provided.' });
    }
    const email = getEmailFromToken(token);

    if (!email) {
        return res.status(401).json({ error: 'Invalid Token.' });
    }
    let conn;
    try {
        conn = await pool.getConnection();

        const result = await conn.query('SELECT admin FROM user WHERE email = ?', [email]);
        conn.release();

        if (result.length === 1 && result[0].admin === 1) {
            next();
        } else {
            res.status(403).json({ error: 'Permission Denied. Admin access required.' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.handleLogout = async (req, res) => {
    try {
        // Supprimer le cookie JWT côté client
        res.clearCookie('token');
        // Envoyer une réponse JSON pour confirmer la déconnexion
        res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur de serveur lors de la déconnexion' });
    }
};