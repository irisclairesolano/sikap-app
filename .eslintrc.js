module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react-hooks/purity': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/refs': 'warn',
  },
};
