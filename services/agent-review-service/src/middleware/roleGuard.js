const RoleName = {
    Agent: 2,
    Admin: 4
};

const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.roleId)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};

export { RoleName };
export default roleGuard;
