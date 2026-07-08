import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 5000;
const app=express();

app.get('/', (req, res) => {
    res.send('AWS Deployment Learning Process on EC2 Instance');
});
app.get('/about', (req, res) => {
    res.send('About Page of the AWS Learning Process');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});