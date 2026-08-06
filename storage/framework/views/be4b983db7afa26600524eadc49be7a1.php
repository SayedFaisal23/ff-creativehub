<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <meta name="creative-user" content='<?php echo json_encode($authUser, 15, 512) ?>'>
    <title><?php echo e(config('app.name', 'FF Creative Hub')); ?></title>
    <link rel="stylesheet" href="<?php echo e(asset('css/app.css')); ?>">
  </head>
  <body>
    <div id="app"></div>
    <div id="modal-root" aria-live="polite"></div>
    <form id="logout-form" method="post" action="<?php echo e(route('logout')); ?>" hidden>
      <?php echo csrf_field(); ?>
    </form>
    <script src="<?php echo e(asset('js/app.js')); ?>"></script>
  </body>
</html>
<?php /**PATH /var/www/html/resources/views/app.blade.php ENDPATH**/ ?>