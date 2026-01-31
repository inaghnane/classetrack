import bcrypt from 'bcryptjs';

const password = 'admin123';
const hash = '$2a$10$rGYqZKqJZ4nXQqh.CZJhWeGN/3qh8qz5KZJ4TqHhZPqTdKqYqP.6q';

bcrypt.compare(password, hash).then((isValid) => {
  console.log('Le mot de passe est valide:', isValid);
});

// Générer un nouveau hash
bcrypt.hash('admin123', 10).then((newHash) => {
  console.log('Nouveau hash:', newHash);
});
