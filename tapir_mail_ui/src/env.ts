const env: { [key: string]: string } = {};

if (window) {
  if (!window._env_) {
    console.log("Missing _env_ variable on window, using defaults")
    window._env_ = {}
  }
  const keys = Object.keys(window._env_)
  Object.keys(window._env_).forEach((key) => {
    env[key] = window._env_[key];
  });

  if (!keys.includes("REACT_APP_API_ROOT")) {
    console.log("REACT_APP_API_ROOT not set, using localhost as default value");
    env["REACT_APP_API_ROOT"] = "http://localhost:8000"
  } else {
    console.log("REACT_APP_API_ROOT is set")
    console.log(env["REACT_APP_API_ROOT"])
  }

  if (!keys.includes("REACT_APP_BASENAME")) {
    console.log("REACT_APP_BASENAME not set, using / as default value");
    env["REACT_APP_BASENAME"] = "/"
  }
}

export default env;
