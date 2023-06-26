interface RegisterCred {
    email: string;
    username: string;
    fullname?: string;
    password: string;
}

interface LoginCred {
    email?: string;
    username?: string;
    password: string;
}

export type { LoginCred, RegisterCred };
