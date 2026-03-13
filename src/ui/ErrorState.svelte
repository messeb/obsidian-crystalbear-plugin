<script lang="ts">
	interface Props {
		title: string;
		description: string;
	}

	let { title, description }: Props = $props();
</script>

<div class="jira-error-state">
	<span class="jira-error-state-title">{title}</span>
	<span class="jira-error-state-desc">{description}</span>
</div>
