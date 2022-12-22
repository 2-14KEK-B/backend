interface RegisterCred {
    email: string;
    username?: string;
    password: string;
}

interface LoginCred {
    email?: string;
    username?: string;
    password: string;
}

export { LoginCred, RegisterCred };
