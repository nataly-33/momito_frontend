import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthStore } from "@core/store/auth.store";
import { authService } from "../services/auth.service";
import { PUBLIC_ROUTES } from "@/core/config/routes";
import { Button } from "@shared/components/ui/Button";
import { Input } from "@shared/components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      login(response.user, response.access, response.refresh);
      
      // Redirigir según el rol del usuario
      const rolNombre = response.user?.rol_detalle?.nombre || (response.user as any)?.rol_nombre;
      if (rolNombre === "Admin" || rolNombre === "Empleado") {
        navigate("/admin");
      } else {
        navigate(PUBLIC_ROUTES.HOME);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales inválidas. Por favor, intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light via-background-main to-primary-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-main/10 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary-main" />
            </div>
            <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-text-secondary">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-light text-primary-main focus:ring-2 focus:ring-primary-main/50"
                />
                <span className="text-text-secondary">Recordarme</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-primary-main hover:text-accent-chocolate transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              ¿No tienes una cuenta?{" "}
              <Link
                to={PUBLIC_ROUTES.REGISTER}
                className="text-primary-main hover:text-accent-chocolate transition-colors font-semibold"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-center mt-6 text-sm text-text-secondary">
          Al continuar, aceptas nuestros{" "}
          <Link to="/terms" className="underline hover:text-text-primary">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link to="/privacy" className="underline hover:text-text-primary">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}

