const db = require('../config/database');
const user = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        if (!fullname || !email || !password) {
            return res.status(400).json({
                message: 'please enter your fullname, email, passaword'
            });
        }

        const existingUsers = await user.getUserByEmail(email);
        if (existingUsers.length > 0) {
            res.status(409).json({
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await user.create(fullname, email, hashedPassword, phone, address, '3');
        res.status(201).json({
            data: {
                id: result.insertId,
                fullname,
                email,
                phone,
                address,
                role: '3'
            },
            message: 'Register Successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

module.exports = {
    register
};
