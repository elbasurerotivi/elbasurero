// js/roleManager.js
// Este archivo se modifica automáticamente desde admin.html

export const roles = {
  "lrotelo@gmail.com": {
    "premium": false,
    "admin": false
  },
  "elbasurerotivi@gmail.com": {
    "premium": true,
    "admin": false
  },
  "emenagarcia@gmail.com": {
    "premium": false,
    "admin": true
  },
  "charsvolta@gmail.com": {
    "premium": false,
    "admin": true
  },
  "jamesalta8817@gmail.com": {
    "premium": false,
    "admin": false
  },
  "delafuentefabiana71@gmail.com": {
    "premium": false,
    "admin": false
  },
  "javiermartinsanchez@outlook.com.ar": {
    "premium": false,
    "admin": false
  },
  "rafatrigos2014@gmail.com": {
    "premium": false,
    "admin": false
  },
  "ferchumica8998@gmail.com": {
    "premium": false,
    "admin": false
  },
  "juangabrielcasalla@gmail.com": {
    "premium": false,
    "admin": false
  },
  "gazzzt15@gmail.com": {
    "premium": false,
    "admin": false
  },
  "dielucero@gmail.com": {
    "premium": false,
    "admin": false
  },
  "f3d3c3p3@gmail.com": {
    "premium": false,
    "admin": false
  },
  "cristiangoldner@gmail.com": {
    "premium": false,
    "admin": false
  },
  "cabraljavier1632@gmail.com": {
    "premium": false,
    "admin": false
  },
  "alvareznaty34@gmail.com": {
    "premium": false,
    "admin": false
  },
  "cardozoli159@gmail.com": {
    "premium": false,
    "admin": false
  },
  "cja_1975@hotmail.com": {
    "premium": false,
    "admin": false
  },
  "lalypitar@gmail.com": {
    "premium": false,
    "admin": false
  },
  "luqueillanesalejandro@gmail.com": {
    "premium": false,
    "admin": false
  },
  "alexeiuska@gmail.com": {
    "premium": false,
    "admin": false
  },
  "robertoarria@gmail.com": {
    "premium": false,
    "admin": false
  },
  "pancho.bonavita@gmail.com": {
    "premium": false,
    "admin": false
  },
  "drl353@hotmail.com": {
    "premium": false,
    "admin": false
  },
  "ale.torresbernal17@gmail.com": {
    "premium": false,
    "admin": false
  },
  "malditoflanders303@hotmail.com": {
    "premium": false,
    "admin": false
  },
  "l.peralta1993@gmail.com": {
    "premium": false,
    "admin": false
  },
  "amelie9403@gmail.com": {
    "premium": false,
    "admin": false
  },
  "cifarellimartin@gmail.com": {
    "premium": false,
    "admin": false
  },
  "luciasuarez.od@gmail.com": {
    "premium": false,
    "admin": false
  },
  "erinlioflor@gmail.com": {
    "premium": false,
    "admin": false
  },
  "bizcochosrancios@gmail.com": {
    "premium": false,
    "admin": false
  },
  "jeandu1026@gmail.com": {
    "premium": false,
    "admin": false
  },
  "lisangel3110@gmail.com": {
    "premium": false,
    "admin": false
  },
  "lucasais96@gmail.com": {
    "premium": false,
    "admin": false
  },
  "rsaira@gmail.com": {
    "premium": false,
    "admin": false
  },
  "a.montoro@live.com": {
    "premium": false,
    "admin": false
  },
  "okandersok@gmail.com": {
    "premium": false,
    "admin": false
  },
  "chquilmes1260@gmail.com": {
    "premium": false,
    "admin": false
  },
  "fusco_lucrecia@hotmail.com": {
    "premium": false,
    "admin": false
  },
  "chinomauroperuzzotti@gmail.com": {
    "premium": false,
    "admin": false
  },
  "car.lotito.101@gmail.com": {
    "premium": false,
    "admin": false
  },
  "thalecelestial@gmail.com": {
    "premium": false,
    "admin": false
  },
  "krnlrkr@gmail.com": {
    "premium": false,
    "admin": false
  },
  "mariaemmaacha@yahoo.com.ar": {
    "premium": false,
    "admin": false
  },
  "dani352yopedrifloo20@gmail.com": {
    "premium": false,
    "admin": false
  },
  "adri.anez3999@gmail.com": {
    "premium": false,
    "admin": false
  },
  "galexhandra@gmail.com": {
    "premium": false,
    "admin": false
  },
  "troyanoreyvaj9011@gmail.com": {
    "premium": false,
    "admin": false
  },
  "andresroderick2023@gmail.com": {
    "premium": false,
    "admin": false
  },
  "summermieternoverano@gmail.com": {
    "premium": false,
    "admin": false
  },
  "luffycracke@gmail.com": {
    "premium": false,
    "admin": false
  },
  "skywalker1977ar@gmail.com": {
    "premium": false,
    "admin": false
  },
  "carlosojeda0587@gmail.com": {
    "premium": false,
    "admin": false
  },
  "davidoller18@gmail.com": {
    "premium": false,
    "admin": false
  }
};

// Función para obtener rol como string
export function getUserRole(email) {
  const role = roles[email] || { premium: false, admin: false };
  if (role.admin) return "admin";
  if (role.premium) return "premium";
  return "user";
}

// Verifica si puede entrar a páginas premium
export function canAccessPremium(email) {
  const role = getUserRole(email);
  return role === "premium" || role === "admin";
}

// Verifica si es admin
export function isAdmin(email) {
  const role = getUserRole(email);
  return role === "admin";
}

// Protección de páginas
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  import("./firebase-config.js").then(({ auth }) => {
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          alert("Debes iniciar sesión para acceder a esta página.");
          window.location.href = redirectUrl;
          return;
        }

        const role = getUserRole(user.email);
        if (!allowedRoles.includes(role)) {
          alert("Acceso restringido. No tienes permiso para ver esta página.");
          window.location.href = redirectUrl;
        } else {
          document.body.style.display = "block";
        }
      });
    });
  });
}
