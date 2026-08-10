<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | {{ config('app.name', 'FF Creative Hub') }}</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  </head>
  <body class="login-page">
    <main class="login-shell">
      <section class="login-panel">
        <div class="brand login-brand">
          <div class="brand-mark">FF</div>
          <div class="brand-text">
            <div class="brand-title">FF Creative Hub</div>
            <div class="brand-subtitle">Role-based workspace</div>
          </div>
        </div>

        <div>
          <div class="eyebrow">Sign in</div>
          <h1>Open your workspace</h1>
          <p class="topbar-copy">Admins land in operational control. Users land in their focused work queue.</p>
        </div>

        @if ($errors->any())
          <div class="empty login-error">{{ $errors->first() }}</div>
        @endif

        @if (session('status'))
          <div class="empty login-success">{{ session('status') }}</div>
        @endif

        <form method="post" action="{{ route('login.store') }}" class="login-form">
          @csrf
          <div class="form-field">
            <label for="email">Staff</label>
            <select id="email" name="email" autocomplete="email" required autofocus>
              @foreach ($users as $user)
                <option value="{{ $user->email }}" @selected(old('email') === $user->email)>
                  {{ $user->name }} - {{ $user->role }} - {{ $user->email }}
                </option>
              @endforeach
            </select>
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" value="password" autocomplete="current-password" required>
          </div>

          <button class="button primary" type="submit">Login</button>
        </form>
      </section>
    </main>
  </body>
</html>
