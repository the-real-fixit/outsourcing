import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'El correo debe ser válido' })
    @IsNotEmpty({ message: 'El correo no puede estar vacío' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
    password: string;
}

export class RegisterDto {
    @IsEmail({}, { message: 'El correo debe ser válido' })
    @IsNotEmpty({ message: 'El correo no puede estar vacío' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    // We can add role later if it's sent from the frontend, but typically it assumes a default (CLIENT)
}
