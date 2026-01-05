{ pkgs }: {
  deps = [
    # Python 3.11
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.virtualenv
    
    # Node.js 20
    pkgs.nodejs_20
    pkgs.nodePackages.npm

    # Build tools
    pkgs.gcc
    pkgs.gnumake
    pkgs.pkg-config
    
    # Required for some Python packages
    pkgs.libffi
    pkgs.openssl
    
    # Utilities
    pkgs.bash
    pkgs.coreutils
  ];
  
  env = {
    PYTHONBIN = "${pkgs.python311}/bin/python3.11";
    LANG = "en_US.UTF-8";
    PYTHONIOENCODING = "utf-8";
  };
}
