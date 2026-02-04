import bcrypt from 'bcrypt';
import UserRepository from '../src/repositories/UserRepository.js';
import RbacRepository from '../src/repositories/RbacRepository.js';

const createAdmin = async () => {
    try {
        const args = process.argv.slice(2);
        if (args.length < 2) {
            console.error('Usage: node scripts/create_admin.js <email> <password> [name]');
            process.exit(1);
        }

        const [email, password, name = 'Super Admin'] = args;
        const scope = 'uta';

        console.log(`Creating Admin User: ${email}`);

        // 1. Check if user exists
        const existing = await UserRepository.findByEmail(email, scope);
        if (existing) {
            console.error('Error: User already exists in UTA scope.');
            process.exit(1);
        }

        // 2. Hash Password
        const password_hash = await bcrypt.hash(password, 10);

        // 3. Create User (Bypassing AuthService validation)
        const user = await UserRepository.create({
            name,
            email,
            phone: null, // Admins might not need phones immediately
            password_hash,
            scope
        });

        console.log(`User created. ID: ${user.id}`);

        // 4. Assign 'super_admin' role
        const role = await RbacRepository.findRoleByName('super_admin', scope);
        if (!role) {
            console.error('Error: super_admin role not found in DB. Did you run migration 005?');
            process.exit(1);
        }

        await RbacRepository.assignRoleToUser(user.id, role.id);
        
        console.log('✅ Success! User assigned super_admin role.');
        process.exit(0);

    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
};

createAdmin();
