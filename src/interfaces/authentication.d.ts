interface RegisterCred {
    email: string;
    password: string;
}

interface LoginCred extends RegisterCred {
    email?: string;
    username?: string;
}

export { LoginCred, RegisterCred };
