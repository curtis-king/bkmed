const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Le fichier est trop volumineux (max 10 Mo).',
      LIMIT_FILE_COUNT: 'Trop de fichiers.',
      LIMIT_UNEXPECTED_FILE: 'Champ de fichier inattendu.',
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }

  if (err.message?.includes('Seules') || err.message?.includes('Type de fichier')) {
    return res.status(400).json({ message: err.message });
  }

  console.error('Erreur non gérée:', err);
  res.status(500).json({ message: 'Erreur serveur interne.' });
};

module.exports = errorHandler;
