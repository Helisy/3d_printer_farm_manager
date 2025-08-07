
const regex_real_name = /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÇ][a-záéíóúàèìòùâêîôûäëïöüç]*(\s[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÇ][a-záéíóúàèìòùâêîôûäëïöüç]*)*$/;
const regex_user_name = /^[a-z-_]+$/;

module.exports = {
    first_name: {
        in: ["body"],
        isString: true,
        custom: {
            options: (field) => { return regex_real_name.test(field); },
            errorMessage: "Fild first_name has incorrect string format",
        },
    },
    last_name: {
        in: ["body"],
        isString: true,
        custom: {
            options: (field) => { return regex_real_name.test(field); },
            errorMessage: 'Field "last_name" has incorrect string format.',
        },
    },
    username: {
        in: ["body"],
        isString: true,
        custom: {
            options: (field) => { return regex_user_name.test(field); },
            errorMessage: 'Field "last_name" has incorrect string format.',
        },
    },
    password: {
        in: ['body'],
        isString: true,
        isLength: {
            errorMessage: 'Field "password" must be at least 6 chars long and max 32.',
            options: { min: 6, max: 32  }
        }
    },
}