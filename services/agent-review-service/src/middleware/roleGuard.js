/** @typedef {1 | 2 | 3 | 4} RoleType */

const RoleName = {
    Customer: 1,
    Agent: 2,
    Journalist: 3,
    Admin: 4,
  };
  
  /**
   * @param {RoleType[]} allowedRoles
   */
  const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !req.user.userRole) {
        return res.status(403).json({
          data: null,
          message: '',
          error: ['User no Access'],
        });
      }
      if (!allowedRoles.includes(req.user.userRole)) {
        return res.status(403).json({
          data: null,
          message: '',
          error: ['User does not have permission to perform this action'],
        });
      }
      next();
    };
  };
  
  export { RoleName };
  export default roleGuard;
  