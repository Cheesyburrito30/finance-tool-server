import { SALT_ROUNDS } from '../constants';
import { User } from '../database';
import { Express } from 'express';
import bcrypt from 'bcrypt';
import { SequelizeScopeError } from 'sequelize';

export const initializeUserRoutes = (app: Express) => {
	// CRUD routes for User model
	app.get('/users', async (req, res) => {
		const users = await User.findAll({
			attributes: ['id', 'name', 'email'],
		});
		res.json(users);
	});

	app.get('/users/:id', async (req, res) => {
		const user = await User.findByPk(req.params.id, {
			attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
		});
		res.json(user);
	});

	app.post('/users', async (req, res) => {
		try {
			const { name, email, password } = req.body ?? {};
			const hashedPassword = await hashPass(password);
			const user = await User.create({ name, email, password: hashedPassword });
			const { password: _userPass, ...userMinusPassword } = user.dataValues;

			res.json({
				status: 200,
				message: 'user created successfully',
				user: userMinusPassword,
			});
		} catch (err) {
			if ((err as any).name === 'SequelizeUniqueConstraintError') {
				res.json({ message: 'That username already exists' });
				return;
			}
			res.json({ message: 'bad request' });
		}
	});

	app.put('/users/:id', async (req, res) => {
		const user = await User.findByPk(req.params.id);
		if (user) {
			await user.update(req.body);
			res.json(user);
		} else {
			res.status(404).json({ message: 'User not found' });
		}
	});

	app.delete('/users/:id', async (req, res) => {
		const user = await User.findByPk(req.params.id);
		if (user) {
			await user.destroy();
			res.json({ message: 'User deleted' });
		} else {
			res.status(404).json({ message: 'User not found' });
		}
	});
};

const hashPass = async (password: string) => {
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashedPass = await bcrypt.hash(password, salt);

	return hashedPass;
};
