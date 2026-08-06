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

        <form method="post" action="{{ route('login.store') }}" class="login-form">
          @csrf
          <div class="form-field">
            <label for="user_id">User</label>
            <select id="user_id" name="user_id" required>
              @foreach ($users as $user)
                <option value="{{ $user->id }}" @selected(old('user_id') === $user->id)>
                  {{ $user->name }} - {{ $user->role }} - {{ $user->department }}
                </option>
              @endforeach
            </select>
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" value="password" required>
          </div>

          <button class="button primary" type="submit">Login</button>
        </form>
      </section>
    </main>
  </body>
</html>
