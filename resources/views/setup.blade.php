<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Setup | {{ config('app.name', 'FF Creative Hub') }}</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  </head>
  <body class="login-page">
    <main class="login-shell">
      <section class="login-panel">
        <div class="brand login-brand">
          <div class="brand-mark">FF</div>
          <div class="brand-text">
            <div class="brand-title">FF Creative Hub</div>
            <div class="brand-subtitle">First-time setup</div>
          </div>
        </div>

        <div>
          <div class="eyebrow">Setup</div>
          <h1>Create first admin</h1>
          <p class="topbar-copy">This account controls users, projects, workflow setup, and system settings.</p>
        </div>

        @if ($errors->any())
          <div class="empty login-error">{{ $errors->first() }}</div>
        @endif

        <form method="post" action="{{ route('setup.store') }}" class="login-form">
          @csrf
          <div class="form-field">
            <label for="name">Name</label>
            <input id="name" name="name" type="text" value="{{ old('name') }}" autocomplete="name" required autofocus>
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required>
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="new-password" required>
          </div>

          <div class="form-field">
            <label for="password_confirmation">Confirm Password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" required>
          </div>

          <button class="button primary" type="submit">Create Admin</button>
        </form>
      </section>
    </main>
  </body>
</html>
