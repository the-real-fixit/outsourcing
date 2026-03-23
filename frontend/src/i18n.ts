import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation strings
const resources = {
  en: {
    translation: {
      settings: {
        title: "Settings",
        subtitle: "Configure your platform preferences.",
        darkMode: "Dark Mode",
        darkModeDesc: "Enable dark themed interface to reduce eye strain.",
        pushNotif: "Push Notifications",
        pushNotifDesc: "Receive alerts when someone contacts you or there are new opportunities.",
        emailNotif: "Email Notifications",
        emailNotifDesc: "Receive a summary of activity and new opportunities in your inbox.",
        language: "Language",
        languageDesc: "Select the platform language.",
        save: "Save Settings",
        saving: "Saving...",
        back: "Back",
        success: "Settings saved successfully",
        error: "Error saving settings"
      },
      nav: {
        home: "Home",
        chats: "Chats",
        profile: "Profile",
        settings: "Settings",
        logout: "Log out"
      }
    }
  },
  es: {
    translation: {
      settings: {
        title: "Ajustes",
        subtitle: "Configura tus preferencias de la plataforma.",
        darkMode: "Modo Oscuro",
        darkModeDesc: "Activa la interfaz con colores oscuros para menos fatiga visual.",
        pushNotif: "Notificaciones Push",
        pushNotifDesc: "Recibe alertas cuando alguien te contacte o haya nuevas oportunidades.",
        emailNotif: "Notificaciones por Email",
        emailNotifDesc: "Recibe un resumen de actividad y nuevas oportunidades en tu correo.",
        language: "Idioma",
        languageDesc: "Selecciona el idioma de la plataforma.",
        save: "Guardar Ajustes",
        saving: "Guardando...",
        back: "Volver",
        success: "Ajustes guardados correctamente",
        error: "Error al guardar los ajustes"
      },
      nav: {
        home: "Inicio",
        chats: "Chats",
        profile: "Perfil",
        settings: "Ajustes",
        logout: "Cerrar sesión"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React already escapes values securely
    }
  });

export default i18n;
