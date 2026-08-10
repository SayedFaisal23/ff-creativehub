<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | <?php echo e(config('app.name', 'FF Creative Hub')); ?></title>
    <link rel="stylesheet" href="<?php echo e(asset('css/app.css')); ?>">
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

        <?php if($errors->any()): ?>
          <div class="empty login-error"><?php echo e($errors->first()); ?></div>
        <?php endif; ?>

        <?php if(session('status')): ?>
          <div class="empty login-success"><?php echo e(session('status')); ?></div>
        <?php endif; ?>

        <form method="post" action="<?php echo e(route('login.store')); ?>" class="login-form">
          <?php echo csrf_field(); ?>
          <div class="form-field">
            <label for="email">Staff</label>
            <select id="email" name="email" autocomplete="email" required autofocus>
              <?php $__currentLoopData = $users; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $user): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <option value="<?php echo e($user->email); ?>" <?php if(old('email') === $user->email): echo 'selected'; endif; ?>>
                  <?php echo e($user->name); ?> - <?php echo e($user->role); ?> - <?php echo e($user->email); ?>

                </option>
              <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
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
<?php /**PATH /var/www/html/resources/views/login.blade.php ENDPATH**/ ?>