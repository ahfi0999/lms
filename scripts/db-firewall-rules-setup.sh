for ip_add in $(cat $1); do
  az postgres flexible-server firewall-rule create --name staging-env-lms-db --resource-group konamars-lms-product --rule-name "app-service-vm-ip-$(echo $ip_add | sed -e "s/\./-/g")" --start-ip-address $ip_add
done
